package com.example.notko;

import android.graphics.Bitmap;
import android.graphics.pdf.PdfRenderer;
import android.os.Bundle;
import android.os.ParcelFileDescriptor;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class PdfViewerActivity extends AppCompatActivity {

    private PdfRenderer pdfRenderer;
    private ParcelFileDescriptor fileDescriptor;
    private List<Bitmap> pageBitmaps = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_pdf_viewer);

        String filePath = getIntent().getStringExtra("FILE_PATH");
        String fileName = getIntent().getStringExtra("FILE_NAME");

        TextView titleText = findViewById(R.id.pdf_title);
        titleText.setText(fileName);

        findViewById(R.id.btn_back).setOnClickListener(v -> finish());

        try {
            renderPdf(new File(filePath));
            RecyclerView recyclerView = findViewById(R.id.pdf_recycler_view);
            recyclerView.setLayoutManager(new LinearLayoutManager(this));
            recyclerView.setAdapter(new PdfAdapter(pageBitmaps));
        } catch (IOException e) {
            Toast.makeText(this, "Error display PDF: " + e.getMessage(), Toast.LENGTH_LONG).show();
            finish();
        }
    }

    private void renderPdf(File file) throws IOException {
        fileDescriptor = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY);
        pdfRenderer = new PdfRenderer(fileDescriptor);

        for (int i = 0; i < pdfRenderer.getPageCount(); i++) {
            PdfRenderer.Page page = pdfRenderer.openPage(i);
            
            // Create a bitmap for the page
            Bitmap bitmap = Bitmap.createBitmap(
                page.getWidth() * 2, // Scale up for better quality
                page.getHeight() * 2, 
                Bitmap.Config.ARGB_8888
            );
            
            page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);
            pageBitmaps.add(bitmap);
            page.close();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        try {
            if (pdfRenderer != null) pdfRenderer.close();
            if (fileDescriptor != null) fileDescriptor.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private static class PdfAdapter extends RecyclerView.Adapter<PdfAdapter.ViewHolder> {
        private final List<Bitmap> bitmaps;

        PdfAdapter(List<Bitmap> bitmaps) {
            this.bitmaps = bitmaps;
        }

        @NonNull
        @Override
        public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_pdf_page, parent, false);
            return new ViewHolder(view);
        }

        @Override
        public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
            holder.imageView.setImageBitmap(bitmaps.get(position));
        }

        @Override
        public int getItemCount() {
            return bitmaps.size();
        }

        static class ViewHolder extends RecyclerView.ViewHolder {
            ImageView imageView;
            ViewHolder(View view) {
                super(view);
                imageView = view.findViewById(R.id.pdf_page_image);
            }
        }
    }
}
